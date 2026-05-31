import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PatchOperation } from "@azure/cosmos";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";
import { Task } from "../models/task.model";

export async function UpdateTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');

    if (!taskId || !organizationId) {
        return {
            status: 400,
            jsonBody: { error: "Missing required query parameters: id, organizationId" }
        };
    }

    let body: Partial<Task>;
    try {
        body = await request.json() as Partial<Task>;
    } catch {
        return {
            status: 400,
            jsonBody: { error: "Invalid JSON body" }
        };
    }

    const now = new Date().toISOString();
    const updatePayload: Partial<Task> = { ...body, updatedAt: now };

    const patchOperations: PatchOperation[] = Object.entries(updatePayload).map(([key, value]) => ({
        op: "replace",
        path: `/${key}`,
        value
    }));

    try {
        const { resource } = await cosmosClient
            .database(DATABASE_NAME)
            .container(CONTAINER_NAME)
            .item(taskId, organizationId)
            .patch<Task>(patchOperations);

        return {
            status: 200,
            jsonBody: resource
        };
    } catch (error) {
        context.log("Error in UpdateTask:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('UpdateTask', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: UpdateTask
});
