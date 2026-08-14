export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TaskStore {
  tasks: Task[];
}

export class TitleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TitleValidationError";
  }
}

const MAX_TITLE_LENGTH = 500;

export function validateTitle(raw: string): string {
  const title = raw.trim();

  if (title.length === 0) {
    throw new TitleValidationError("Error: Task title cannot be empty.");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new TitleValidationError(
      "Error: Task title must be 500 characters or fewer.",
    );
  }

  return title;
}

export function createTask(title: string, id: string, createdAt: string): Task {
  return {
    id,
    title,
    completed: false,
    createdAt,
  };
}
