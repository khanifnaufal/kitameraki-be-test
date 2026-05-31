import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";
import { Task } from "../models/task.model";

export async function GetTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const taskId = request.query.get('id');
    const organizationId = request.query.get('organizationId');

    if (!taskId || !organizationId) {
        return {
            status: 400,
            jsonBody: { error: "Missing required query parameters: id, organizationId" }
        };
    }

    try {
        const { resource } = await cosmosClient
            .database(DATABASE_NAME)
            .container(CONTAINER_NAME)
            .item(taskId, organizationId)
            .read<Task>();

        if (!resource) {
            return {
                status: 404,
                jsonBody: { error: "Task not found" }
            };
        }

        return {
            status: 200,
            jsonBody: resource
        };
    } catch (error) {
        context.log("Error in GetTask:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('GetTask', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: GetTask
});
