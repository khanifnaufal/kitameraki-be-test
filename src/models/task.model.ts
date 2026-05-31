export interface Task {
    id?: string;
    organizationId: string;
    title: string;
    description?: string;
    status: 'todo' | 'in-progress' | 'done';
    createdAt?: string;
    updatedAt?: string;
}
