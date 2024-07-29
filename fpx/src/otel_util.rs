use http::{HeaderMap, HeaderName, HeaderValue};
use opentelemetry::propagation::{Extractor, Injector};
use std::str::FromStr;

pub struct HeaderMapInjector<'a>(pub &'a mut HeaderMap);

impl<'a> Injector for HeaderMapInjector<'a> {
    fn set(&mut self, key: &str, val: String) {
        if let Ok(key) = HeaderName::from_str(key) {
            if let Ok(val) = HeaderValue::from_str(&val) {
                self.0.insert(key, val);
            }
        }
    }
}

pub struct HeaderMapExtractor<'a>(pub &'a HeaderMap);

impl<'a> Extractor for HeaderMapExtractor<'a> {
    fn get(&self, key: &str) -> Option<&str> {
        self.0.get(key).and_then(|val| val.to_str().ok())
    }

    fn keys(&self) -> Vec<&str> {
        self.0
            .keys()
            .map(|header_name| header_name.as_str())
            .collect::<Vec<_>>()
    }
}
