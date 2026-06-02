import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";
import { Task } from "../models/task.model";

export async function InsertTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let body: Partial<Task>;
    try {
        body = await request.json() as Partial<Task>;
    } catch {
        return {
            status: 400,
            jsonBody: { error: "Invalid JSON body" }
        };
    }

    if (!body.organizationId || !body.title || !body.status) {
        return {
            status: 400,
            jsonBody: { error: "Missing required fields: organizationId, title, status" }
        };
    }

    const now = new Date().toISOString();
    const newTask: Task = {
        ...body,
        organizationId: body.organizationId,
        title: body.title,
        status: body.status,
        createdAt: now,
        updatedAt: now,
        type: 'task'
    };

    try {
        const { resource } = await cosmosClient
            .database(DATABASE_NAME)
            .container(CONTAINER_NAME)
            .items.create<Task>(newTask);

        return {
            status: 201,
            jsonBody: resource
        };
    } catch (error) {
        context.log("Error in InsertTask:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('InsertTask', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: InsertTask
});
