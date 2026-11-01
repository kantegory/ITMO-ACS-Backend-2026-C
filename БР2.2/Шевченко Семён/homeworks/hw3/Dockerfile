FROM node:22-alpine
RUN npm install --prefix /opt/tools newman@6.2.3
ENV NODE_PATH=/opt/tools/node_modules
WORKDIR /workspace
CMD ["node", "--version"]
