#[cfg(feature = "fpx-api")]
mod fpx_api;

#[cfg(feature = "fpx-api")]
pub use fpx_api::*;

#[cfg(not(feature = "fpx-api"))]
mod legacy;

#[cfg(not(feature = "fpx-api"))]
pub use legacy::*;
