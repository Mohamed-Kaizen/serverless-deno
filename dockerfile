FROM denoland/deno:alpine

ENV APP_HOME=/home/serverless

RUN mkdir -p $APP_HOME

WORKDIR $APP_HOME

RUN deno install -qAf --unstable https://deno.land/x/denon/denon.ts

COPY . $APP_HOME/

CMD ["denon", "run", "--allow-all", "main.ts"]

