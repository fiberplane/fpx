use anyhow::Result;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use std::ops::{Deref, DerefMut};
use time::OffsetDateTime;

/// This is a wrapper around `T` that will deserialize from JSON.
///
/// This is intended to be used with properties of a struct that will be
/// deserialized from a libsql [`Row`]. Since there is a limited number of
/// values available we need to serialize the data in a Database column as JSON
/// so that we can still use complicated data structures, such as arrays and
/// maps.
#[derive(Debug)]
pub struct Json<T>(pub T);

impl<T> Clone for Json<T>
where
    T: Clone,
{
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}

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

impl<T> Serialize for Json<T>
where
    T: Serialize,
{
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let value = serde_json::to_string(&self.0).map_err(serde::ser::Error::custom)?;

        value.serialize(serializer)
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

#[cfg(feature = "wasm-bindgen")]
impl<T> From<Json<T>> for wasm_bindgen::JsValue
where
    T: Serialize,
{
    fn from(value: Json<T>) -> Self {
        let value = serde_json::to_string(&value.0).expect("failed to serialize Json<T>");
        wasm_bindgen::JsValue::from_str(&value)
    }
}

#[cfg(feature = "libsql")]
impl<T> From<Json<T>> for libsql::Value
where
    T: Serialize,
{
    fn from(value: Json<T>) -> Self {
        let value = serde_json::to_string(&value.0).expect("failed to serialize Json<T>");
        libsql::Value::Text(value)
    }
}

/// This is a wrapper that makes it a bit easier to work with a timestamp that
/// is serialized as a `f64`. This should only be used in the database layer.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Timestamp(pub time::OffsetDateTime);

impl Timestamp {
    pub fn now() -> Self {
        Self(OffsetDateTime::now_utc())
    }

    pub fn unix_nanos(&self) -> i128 {
        self.0.unix_timestamp_nanos()
    }

    pub fn fractional(&self) -> f64 {
        Self::nanos_to_fractional(self.unix_nanos())
    }

    fn nanos_to_fractional(t: i128) -> f64 {
        let t = t as f64;
        t / 1_000_000_000_f64
    }

    fn fractional_to_nanos(t: f64) -> i128 {
        (t * 1_000_000_000_f64) as i128
    }
}

impl TryFrom<f64> for Timestamp {
    type Error = anyhow::Error;

    fn try_from(timestamp: f64) -> std::result::Result<Self, Self::Error> {
        let nanos = Timestamp::fractional_to_nanos(timestamp);
        // Note: This will fail if a really big date is passed in. This won't
        // happen for a while, though it could be used maliciously.
        let datetime =
            OffsetDateTime::from_unix_timestamp_nanos(nanos).map_err(|err| anyhow::anyhow!(err))?;

        Ok(Self(datetime))
    }
}

impl From<Timestamp> for time::OffsetDateTime {
    fn from(timestamp: Timestamp) -> Self {
        timestamp.0
    }
}

impl From<time::OffsetDateTime> for Timestamp {
    fn from(timestamp: time::OffsetDateTime) -> Self {
        Self(timestamp)
    }
}

#[cfg(feature = "wasm-bindgen")]
impl From<Timestamp> for wasm_bindgen::JsValue {
    fn from(value: Timestamp) -> Self {
        wasm_bindgen::JsValue::from_f64(value.fractional())
    }
}

#[cfg(feature = "libsql")]
impl From<Timestamp> for libsql::Value {
    fn from(timestamp: Timestamp) -> Self {
        libsql::Value::Real(timestamp.fractional())
    }
}

impl Serialize for Timestamp {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let timestamp = self.fractional();
        timestamp.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Timestamp {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let timestamp: f64 = Deserialize::deserialize(deserializer)?;
        Timestamp::try_from(timestamp).map_err(serde::de::Error::custom)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::format_description::well_known::Rfc3339;

    /// Simple struct that has all the necessary traits to be serialized and
    /// deserialize.
    #[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
    struct Sample {
        name: String,
        age: u32,
    }

    #[test]
    fn json_serialize_deserialize() {
        let sample_1 = Sample {
            name: "John Doe".to_string(),
            age: 42,
        };

        let json = Json(sample_1.clone());

        // Serialize and deserialize the JSON wrapper.
        let serialized = serde_json::to_string(&json).expect("Unable to serialize");
        let deserialized: Json<Sample> =
            serde_json::from_str(&serialized).expect("Unable to deserialize");

        // Get the new sample from the deserialized value.
        let sample_2 = deserialized.into_inner();

        // Verify that the deserialized value is the same as the original.
        assert_eq!(sample_1, sample_2);
    }

    #[test]
    fn timestamp_serialize_deserialize() {
        let timestamp_1 =
            time::OffsetDateTime::parse("2024-08-07T08:39:51+00:00", &Rfc3339).unwrap();
        let timestamp_1 = Timestamp(timestamp_1);

        // Serialize and deserialize the JSON wrapper.
        let serialized = serde_json::to_string(&timestamp_1).expect("Unable to serialize");
        let timestamp_2: Timestamp =
            serde_json::from_str(&serialized).expect("Unable to deserialize");

        // Note: Given that we're working with floats, we can't really compare
        // the two timestamps, so we will just ignore the sub-sec precision.
        assert_eq!(
            timestamp_1.0.replace_nanosecond(0).unwrap(),
            timestamp_2.0.replace_nanosecond(0).unwrap()
        )
    }

    #[cfg(feature = "wasm-bindgen")]
    #[test]
    fn timestamp_serialize_wasm_bindgen() {
        let timestamp_1 =
            time::OffsetDateTime::parse("2024-08-07T08:39:51+00:00", &Rfc3339).unwrap();
        let timestamp_1 = Timestamp(timestamp_1);
        let timestamp_1_fractional = timestamp_1.fractional();

        let js_value: wasm_bindgen::JsValue = timestamp_1.into();
        let js_value_fractional = js_value.as_f64().unwrap();

        assert_eq!(timestamp_1_fractional, js_value_fractional)
    }

    #[cfg(feature = "libsql")]
    #[test]
    fn timestamp_serialize_libsql() {
        let timestamp_1 =
            time::OffsetDateTime::parse("2024-08-07T08:39:51+00:00", &Rfc3339).unwrap();
        let timestamp_1 = Timestamp(timestamp_1);
        let timestamp_1_fractional = timestamp_1.fractional();

        let libsql_value: libsql::Value = timestamp_1.into();
        match libsql_value {
            libsql::Value::Real(value) => {
                assert_eq!(timestamp_1_fractional, value)
            }
            _ => panic!("Expected libsql::Value::Real"),
        }
    }
}
