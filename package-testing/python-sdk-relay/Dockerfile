FROM python:3.12

# Install Cargo and Rust dependencies
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the source code
COPY src/ ./src/

COPY --chmod=755 build-and-run.sh /

ENV SDK_RELAY_HOST=0.0.0.0

EXPOSE $SDK_RELAY_PORT

CMD ["/build-and-run.sh"]
