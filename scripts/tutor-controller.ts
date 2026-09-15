import { createControllerServer } from "../src/lib/tutor/voice/controller";
const { server,controller } = createControllerServer();
const port = Number(process.env.TUTOR_CONTROLLER_PORT ?? 4310);
server.listen(port,process.env.TUTOR_CONTROLLER_HOST ?? "127.0.0.1",() => { console.log(`Tutor controller listening on port ${port}.`); });
const timer = setInterval(() => { void controller.reconcile().catch(() => console.error("Tutor controller reconciliation failed.")); },5000);
for (const signal of ["SIGINT","SIGTERM"] as const) process.on(signal,() => { clearInterval(timer); server.close(); void controller.shutdown().finally(() => process.exit(0)); });
