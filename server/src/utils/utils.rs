use chrono::{Datelike, Timelike, Utc};
use mongodb::bson::{to_bson, Document};

pub fn extract_month_year(bson_datetime: mongodb::bson::DateTime) -> (u32, u32, i32) {
    // Convert bson::DateTime to chrono::DateTime
    let chrono_datetime: chrono::DateTime<Utc> =
        chrono::DateTime::from_timestamp_millis(bson_datetime.timestamp_millis())
            .expect("failed datetime conversion");

    // Extract the month and year
    let month = chrono_datetime.month();
    let year = chrono_datetime.year();
    let day = chrono_datetime.day();

    (day, month, year)
}

pub fn percentage_of_day(datetime: chrono::DateTime<Utc>) -> f64 {
    let seconds_passed = datetime.num_seconds_from_midnight() as f64;
    let total_seconds_in_a_day = 24.0 * 60.0 * 60.0 as f64;

    (seconds_passed / total_seconds_in_a_day) * 100.0
}

pub fn insert_optional<T: serde::Serialize>(doc: &mut Document, key: &str, value: Option<T>) {
    if let Some(v) = value {
        if let Ok(bson_value) = to_bson(&v) {
            doc.insert(key, bson_value);
        }
    }
}
