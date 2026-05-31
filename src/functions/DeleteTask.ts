import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";

export async function DeleteTask(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
        await cosmosClient
            .database(DATABASE_NAME)
            .container(CONTAINER_NAME)
            .item(taskId, organizationId)
            .delete();

        return {
            status: 200,
            jsonBody: { message: "Task deleted successfully" }
        };
    } catch (error) {
        context.log("Error in DeleteTask:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('DeleteTask', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: DeleteTask
});
