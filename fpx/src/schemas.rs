use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(JsonSchema, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MyStruct {
    #[validate(range(min = 1, max = 10))]
    pub my_u32: u32,
}

#[derive(JsonSchema, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MyOtherStruct {
    #[validate(regex(pattern = "^https://"))]
    pub my_url: String,
}
