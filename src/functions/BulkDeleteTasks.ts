import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";

export async function BulkDeleteTasks(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const organizationId = request.query.get('organizationId');

    if (!organizationId) {
        return {
            status: 400,
            jsonBody: { error: "Missing required query parameter: organizationId" }
        };
    }

    let ids: string[];
    try {
        const body = await request.json();
        if (!Array.isArray(body)) {
            return {
                status: 400,
                jsonBody: { error: "Request body must be an array of task IDs" }
            };
        }
        ids = body as string[];
    } catch {
        return {
            status: 400,
            jsonBody: { error: "Invalid JSON body" }
        };
    }

    try {
        const container = cosmosClient.database(DATABASE_NAME).container(CONTAINER_NAME);

        await Promise.all(
            ids.map((id) => container.item(id, organizationId).delete())
        );

        return {
            status: 200,
            jsonBody: { message: `Successfully deleted ${ids.length} task(s)` }
        };
    } catch (error) {
        context.log("Error in BulkDeleteTasks:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('BulkDeleteTasks', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: BulkDeleteTasks
});
