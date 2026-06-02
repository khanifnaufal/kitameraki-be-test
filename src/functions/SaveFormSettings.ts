import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosClient, DATABASE_NAME, CONTAINER_NAME } from "../config/cosmosClient";
import { FormSettings } from "../models/formSettings.model";

export async function SaveFormSettings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    let body: Partial<FormSettings>;
    try {
        body = await request.json() as Partial<FormSettings>;
    } catch (error: unknown) {
        return {
            status: 400,
            jsonBody: { error: "Invalid JSON body" }
        };
    }

    if (!body || !body.organizationId || !body.fields) {
        return {
            status: 400,
            jsonBody: { error: "Missing required fields: organizationId, fields" }
        };
    }

    const organizationId = body.organizationId;
    const fields = body.fields;
    const now = new Date().toISOString();

    try {
        const { resources } = await cosmosClient
            .database(DATABASE_NAME)
            .container(CONTAINER_NAME)
            .items.query<FormSettings>({
                query: "SELECT * FROM c WHERE c.organizationId = @organizationId AND c.type = 'formSettings'",
                parameters: [{ name: "@organizationId", value: organizationId }]
            })
            .fetchAll();

        let savedSettings: FormSettings;

        if (resources && resources.length > 0) {
            const existingItem = resources[0];
            const existingId = existingItem.id;
            if (!existingId) {
                throw new Error("Existing item does not have an id");
            }
            
            const updatedSettings: FormSettings = {
                id: existingId,
                organizationId,
                fields,
                type: 'formSettings',
                updatedAt: now
            };

            const { resource } = await cosmosClient
                .database(DATABASE_NAME)
                .container(CONTAINER_NAME)
                .item(existingId, organizationId)
                .replace<FormSettings>(updatedSettings);

            if (!resource) {
                throw new Error("Failed to replace existing form settings document");
            }
            savedSettings = resource;
        } else {
            const newSettings: FormSettings = {
                organizationId,
                fields,
                type: 'formSettings',
                updatedAt: now
            };

            const { resource } = await cosmosClient
                .database(DATABASE_NAME)
                .container(CONTAINER_NAME)
                .items.create<FormSettings>(newSettings);

            if (!resource) {
                throw new Error("Failed to create new form settings document");
            }
            savedSettings = resource;
        }

        return {
            status: 200,
            jsonBody: savedSettings
        };
    } catch (error: unknown) {
        context.log("Error in SaveFormSettings:", error);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('SaveFormSettings', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: SaveFormSettings
});
