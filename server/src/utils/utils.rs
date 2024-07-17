use chrono::{Datelike, Utc};
use mongodb::bson::DateTime;

pub fn extract_month_year(bson_datetime: DateTime) -> (u32, u32, i32) {
    // Convert bson::DateTime to chrono::DateTime
    let chrono_datetime: chrono::DateTime<Utc> = bson_datetime.into();

    // Extract the month and year
    let month = chrono_datetime.month();
    let year = chrono_datetime.year();
    let day = chrono_datetime.day();

    (day, month, year)
}
