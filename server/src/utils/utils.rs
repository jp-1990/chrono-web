use std::iter;

use mongodb::bson::{to_bson, Document};
use rand::distributions::Alphanumeric;
use rand::prelude::SliceRandom;
use rand::{thread_rng, Rng};

pub fn insert_optional<T: serde::Serialize>(doc: &mut Document, key: &str, value: Option<T>) {
    if let Some(v) = value {
        if let Ok(bson_value) = to_bson(&v) {
            doc.insert(key, bson_value);
        }
    }
}

pub fn generate_password(length: usize) -> String {
    let special_chars = b"!@#$%^&*()_+-=[]{}|;:,.<>?";
    let mut rng = thread_rng();

    // Start with random alphanumeric characters
    let mut password: String = iter::repeat_with(|| rng.sample(Alphanumeric))
        .take(length - 2) // Reserve space for special characters
        .map(char::from)
        .collect();

    // Add two random special characters to ensure complexity
    password.push(*special_chars.choose(&mut rng).unwrap() as char);
    password.push(*special_chars.choose(&mut rng).unwrap() as char);

    // Shuffle the password to mix special characters into the string
    password.chars().collect::<Vec<_>>().into_iter().collect()
}

pub fn generate_test_email() -> String {
    let special_chars = b"!@#$%^&*()_+-=[]{}|;:,.<>?";
    let mut rng = thread_rng();

    // Start with random alphanumeric characters
    let mut email: String = iter::repeat_with(|| rng.sample(Alphanumeric))
        .take(12 - 2) // Reserve space for special characters
        .map(char::from)
        .collect();

    // Add two random special characters to ensure complexity
    email.push(*special_chars.choose(&mut rng).unwrap() as char);
    email.push(*special_chars.choose(&mut rng).unwrap() as char);

    // Shuffle the password to mix special characters into the string
    (email
        .chars()
        .collect::<Vec<_>>()
        .into_iter()
        .collect::<String>())
        + "@test.com"
}
