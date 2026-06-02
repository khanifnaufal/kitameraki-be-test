import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";
import { Task } from "../models/task.model";

export async function GetTasks(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const organizationId = request.query.get('organizationId');

    if (!organizationId) {
        return {
            status: 400,
            jsonBody: { error: "Missing required query parameter: organizationId" }
        };
    }

    try {
        const { resources } = await cosmosClient
            .database(DATABASE_NAME)
            .container(CONTAINER_NAME)
            .items.query<Task>({
                query: "SELECT * FROM c WHERE c.organizationId = @organizationId AND (NOT IS_DEFINED(c.type) OR c.type = 'task')",
                parameters: [{ name: "@organizationId", value: organizationId }]
            })
            .fetchAll();

        return {
            status: 200,
            jsonBody: resources
        };
    } catch (error) {
        context.log("Error in GetTasks:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('GetTasks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: GetTasks
});
