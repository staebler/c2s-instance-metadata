FROM registry.access.redhat.com/ubi8/nodejs-12

RUN npm install
RUN npm i yargs
CMD npm run -d start

ADD bin/ .

ENTRYPOINT ["node", "intercept.js"]
