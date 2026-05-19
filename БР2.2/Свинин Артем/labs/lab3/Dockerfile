FROM golang:1.26-alpine AS builder

ARG SERVICE

WORKDIR /app

COPY go.work go.work.sum ./

COPY . .

WORKDIR /app/services/${SERVICE}

RUN go build -o /bin/service ./cmd

FROM alpine:3.19

RUN apk --no-cache add ca-certificates

COPY --from=builder /bin/service /service

ENTRYPOINT ["/service"]