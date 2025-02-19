# Example

## 1. How to run the code
- Clone the repository
- Run the following command in the terminal
```
$ yarn install
$ LOG_LEVEL=info yarn dev
```

### Available environment variables
- `LOG_LEVEL`: The log level of the application. Default is `info`. Available values are `error`, `warn`, `info`, `debug`, `trace`.
- `SPEED`: The speed of the application. Default is `1`. Available values are integers `1` to `1000`.


## 2. Caveats
- The code may encounter dead lock
- By running the code 1000x faster, `SPEED=1000 yarn dev`, the code will encounter dead lock.
- It's actually an architectural problem, where we design a pipeline-ish system, but the private key management system is a shared state that stops us from decoupling execution of different stages. And it's more likely to happen when the code runs faster, also when we naively use `Promise.all` to run all apps in parallel.
- We could solve this by re-design the architecture. However, since this has to be submitted by the end of the day, I will go with the original design.
