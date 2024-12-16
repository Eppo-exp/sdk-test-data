FROM ruby:3.2

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copy the source code
COPY src/ ./src/

CMD ["ruby", "/app/src/server.rb"] 
