FROM denoland/deno:alpine

ENV APP_HOME=/home/serverless

RUN mkdir -p $APP_HOME

WORKDIR $APP_HOME

COPY . $APP_HOME/

CMD ["deno", "task", "start"]

