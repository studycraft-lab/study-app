FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    TUTOR_CONTROLLER_HOST=0.0.0.0 \
    TUTOR_CONTROLLER_PORT=4310
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY tsconfig.json ./
COPY schemas ./schemas
COPY src/lib ./src/lib
COPY scripts/tutor-controller.ts ./scripts/tutor-controller.ts
USER node
EXPOSE 4310
# Liveness only. Authenticated /health additionally checks database/model readiness.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.TUTOR_CONTROLLER_PORT+'/health').then(r=>process.exit(r.status===401?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--conditions=react-server", "--import", "tsx", "scripts/tutor-controller.ts"]
