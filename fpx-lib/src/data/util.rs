use anyhow::Result;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use std::ops::{Deref, DerefMut};

/// This is a wrapper around `T` that will deserialize from JSON.
///
/// This is intended to be used with properties of a struct that will be
/// deserialized from a libsql [`Row`]. Since there is a limited number of
/// values available we need to serialize the data in a Database column as JSON
/// so that we can still use complicated data structures, such as arrays and
/// maps.
#[derive(Debug)]
pub struct Json<T>(pub T);

impl<T> Json<T> {
    pub fn into_inner(self) -> T {
        self.0
    }
}

impl<T> Deref for Json<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for Json<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T> AsRef<T> for Json<T> {
    fn as_ref(&self) -> &T {
        &self.0
    }
}

impl<T> AsMut<T> for Json<T> {
    fn as_mut(&mut self) -> &mut T {
        &mut self.0
    }
}

impl<T> Default for Json<T>
where
    T: Default,
{
    fn default() -> Self {
        Self(T::default())
    }
}

impl<'de, T> Deserialize<'de> for Json<T>
where
    T: DeserializeOwned,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string: String = Deserialize::deserialize(deserializer)?;
        let json: T = serde_json::from_str(&string).map_err(serde::de::Error::custom)?;

        Ok(Json(json))
    }
}

/// This is a wrapper that makes it a bit easier to work with a timestamp that
/// is serialized as a `u64` in the database (since libsql doesn't have a native
/// timestamp/datetime type).
#[derive(Default)]
pub struct Timestamp(u64);

impl Timestamp {
    pub fn unix_nanos(&self) -> u64 {
        self.0
    }

    pub fn now() -> Self {
        Self(time::OffsetDateTime::now_utc().unix_timestamp_nanos() as u64)
    }
}

impl From<Timestamp> for time::OffsetDateTime {
    fn from(timestamp: Timestamp) -> Self {
        // NOTE: this should not happen any time soon, so we should be able to
        //       get away with this for now.
        time::OffsetDateTime::from_unix_timestamp_nanos(timestamp.unix_nanos() as i128)
            .expect("timestamp is too large for OffsetDateTime")
    }
}

impl From<time::OffsetDateTime> for Timestamp {
    fn from(timestamp: time::OffsetDateTime) -> Self {
        let nanos = timestamp.unix_timestamp_nanos();
        Self(nanos as u64)
    }
}

impl Deref for Timestamp {
    type Target = u64;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Timestamp {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl AsRef<u64> for Timestamp {
    fn as_ref(&self) -> &u64 {
        &self.0
    }
}

impl AsMut<u64> for Timestamp {
    fn as_mut(&mut self) -> &mut u64 {
        &mut self.0
    }
}

impl Serialize for Timestamp {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_i64(self.0 as i64)
    }
}

impl<'de> Deserialize<'de> for Timestamp {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let timestamp: i64 = Deserialize::deserialize(deserializer)?;

        Ok(Timestamp(timestamp as u64))
    }
}
