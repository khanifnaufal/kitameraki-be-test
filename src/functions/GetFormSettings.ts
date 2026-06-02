import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";
import { FormSettings } from "../models/formSettings.model";

export async function GetFormSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
            .items.query<FormSettings>({
                query: "SELECT * FROM c WHERE c.organizationId = @organizationId AND c.type = 'formSettings'",
                parameters: [{ name: "@organizationId", value: organizationId }]
            })
            .fetchAll();

        if (!resources || resources.length === 0) {
            return {
                status: 200,
                jsonBody: {
                    fields: [
                        { id: 'title', label: 'Title', type: 'text', required: true, order: 0, column: 1, row: 0 },
                        { id: 'description', label: 'Description', type: 'text', required: false, order: 1, column: 2, row: 0 },
                        { id: 'status', label: 'Status', type: 'text', required: true, order: 2, column: 1, row: 1 }
                    ]
                }
            };
        }

        return {
            status: 200,
            jsonBody: resources[0]
        };
    } catch (error: unknown) {
        context.log("Error in GetFormSettings:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('GetFormSettings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: GetFormSettings
});
