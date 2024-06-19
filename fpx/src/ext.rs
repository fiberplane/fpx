use anyhow::{Context, Result};
use libsql::{de, Rows};
use serde::de::DeserializeOwned;

pub(crate) trait RowsExt {
    async fn fetch_one<T: DeserializeOwned>(&mut self) -> Result<T>;

    async fn fetch_optional<T: DeserializeOwned>(&mut self) -> Result<Option<T>>;

    async fn fetch_all<T: DeserializeOwned>(&mut self) -> Result<Vec<T>>;
}

impl RowsExt for Rows {
    /// `T` must be a `struct`
    async fn fetch_one<T: DeserializeOwned>(&mut self) -> Result<T> {
        match self.next().await? {
            Some(row) => Ok(de::from_row(&row).context("failed to map into target type")?),
            None => todo!("put db error here"),
        }
    }

    /// `T` must be a `struct`
    async fn fetch_optional<T: DeserializeOwned>(&mut self) -> Result<Option<T>> {
        match self.next().await? {
            Some(row) => Ok(Some(
                de::from_row(&row).context("failed to map into target type")?,
            )),
            None => Ok(None),
        }
    }

    /// `T` must be a `struct`
    async fn fetch_all<T: DeserializeOwned>(&mut self) -> Result<Vec<T>> {
        let mut results = Vec::with_capacity(5);

        while let Some(row) = self.next().await? {
            results.push(de::from_row(&row).context("failed to map into target type")?);
        }

        Ok(results)
    }
}
