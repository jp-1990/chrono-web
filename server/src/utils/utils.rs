use mongodb::bson::{to_bson, Document};

pub fn insert_optional<T: serde::Serialize>(doc: &mut Document, key: &str, value: Option<T>) {
    if let Some(v) = value {
        if let Ok(bson_value) = to_bson(&v) {
            doc.insert(key, bson_value);
        }
    }
}
