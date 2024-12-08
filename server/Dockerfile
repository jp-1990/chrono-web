# notes:
# docker build -t jp/chrono-server .
# docker run -p 8000:8000 --env-file ./.env -t jp/chrono-server

# rust = official docker rust image
# gcr.io/distroless/cc-debian12

# stage:0 generate dependencies list
FROM rust AS planner

WORKDIR /server

RUN cargo install cargo-chef

COPY . .

# generate dependency list
RUN cargo chef prepare --recipe-path recipe.json

# stage:1 build dependencies
FROM rust AS cache

WORKDIR /server

RUN cargo install cargo-chef

# copy dependency list
COPY --from=planner /server/recipe.json recipe.json

# build dependencies
RUN cargo chef cook --release --recipe-path recipe.json

# stage:2 build image
FROM rust AS builder

# create user
ENV USER=web
ENV UID=1001

RUN adduser \
  --disabled-password \
  --gecos "" \
  --home "/nonexistent" \
  --shell "/sbin/nologin" \
  --no-create-home \
  --uid "${UID}" \
  "${USER}"

COPY . /server
WORKDIR /server

# copy cached build
COPY --from=cache /server/target /target
COPY --from=cache /usr/local/cargo /usr/local/cargo

# build prod
RUN cargo build --release

# stage:3 runtime image
FROM gcr.io/distroless/cc-debian12

# import user
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# copy build
COPY --from=builder /server/target/release/server /server/server
WORKDIR /server

# run commands as least privilege user
USER web:web

# start the application
CMD ["./server"]
