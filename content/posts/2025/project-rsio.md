+++
title = "New Project: HTTP Longpoll"
date = 2025-03-19T21:29:35Z
images = []
tags = ['rust']
categories = []
draft = true
+++

<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
</script>

Its 2025 and I'm telling you how my new project is about implementing http longpoll? You might think I'm mad... but hear me out.

It started life as a wish to port over some of the api of the now venerable libray 'SocketIO' over to rust.

Websockets are great but they are only the transport layer, you need a bit more functionality in order to provide reliable end to end 
communication, something that socketio did with relative success.

But when working though the ideas, both because of lack of man power and arguably a philosophical mismatch between
JS and rust, the question quickly became 'what SUBSET' of functionality is relevant and on the TODO list? It actually
became a question of which 'layer' of the protocol do we want, because SocketIO, like all things networking, is a layered abstraction.

<pre class="mermaid">
block-beta
  block 
    columns 2
    socketio:2
    block
        columns 2
        engineio:2
        WS Poll
    end
  end
</pre>

The lower level 'engineio' layer provided transport abstraction over different network protocols and a way to 'upgrade' disparate protocols,
as well as a heartbeat implementation.

I've always considered one of the strengths of Rust's ecosystem to be its drive for modular and low level libraries, leaving the opinionated code 
to the application developer. In that light, focusing on the engineio layer was a natural direction to take and more interesting for purpose of side project zen.

And so I found myself writing a small modualr http longpoll library, decoupled from any notion of the original engine-io origins,
with the long term plan of having it power some of the functionality in future crates.


## Code Example
Here's an early glimpse of one the example found in the repo

```rust
#[tokio::main]
async fn main() {

    // 1
    let app = Router::new()
        .route("/session", post(session_new))
        .route("/session/{id}", get(session_poll))
        .with_state(LongPollState::new());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// 2a
async fn session_new(State(state): State<LongPollState>) -> impl IntoResponse {
    let id = uuid7();
    let cleanup = (id, state.clone());

    let sender = HTTPLongPoll::default().connect(move |s| async move {
        session_handler(s).await;
        cleanup.1.sessions.write().unwrap().remove(&cleanup.0);
    });
    state.sessions.write().unwrap().insert(id, sender);
    Json(id)
}

// 2b
async fn session_poll(
    State(state): State<LongPollState>,
    Path(session_id): Path<Uuid>,
    req: Request,
) -> Result<Response, Error> {
    let mut session = state
        .sessions
        .read()
        .unwrap()
        .get(&session_id)
        .cloned()
        .ok_or(Error::SessionNotFound)?;

    session.send(req).await.map_err(|_| Error::SessionError)
}

// 3
async fn session_handler(s: Session) {
    let (mut tx, mut rx) = s.split();
    loop {
        tokio::select! {
            Some(m) = rx.next() => {
                match m {
                    // task will be informed why connection closed
                    Err(reason) => {
                        break
                    }
                    Ok(bytes) => {
                        // echo
                       let Ok(_) = tx.send(bytes).await else { break };
                    }
                }
            }
            else => {
                //
                break
            }
        }
    }
}

```

Notes:
1. Axum integration happens via normal http handlers, one of the connection/session init and then future polls.
2. Handler implemntation assume there is some state defined to hold on going long poll streams
3. The actual handler for the longpoll statemachine/future looks suspiciously like the standard ws example...

I would say the main design decision here was to conciously not opt to hide things behind services and extractors,
but instead provide just the basic primitive and allow the app developer decide how he wants to hold the state
ie the set of channels that will forward request to the correct longpoll statemachine task.
Its obviously not the most ergonomic approach, but I think it offers an unopininated approach, one that can
evolve graciously along side the axum framework.

The other point was to provide a similar interface as the current websocket extractor so that it would
be possible to write similar logic and ideally the same implemntation to handle both, one to expand upon in the future.

## Whats Next?

- ?








