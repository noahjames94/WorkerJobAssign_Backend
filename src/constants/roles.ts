import EnumHelper from "../utils/enumHelper";

interface IRole {
  role: string;
  name: string;
  id: number;
}

export function getRoleById(id: number): IRole {
  if (id === undefined || !new EnumHelper(EROLES).values.includes(id)) {
    return undefined;
  }
  const index = ROLES.findIndex(ROLE => ROLE.id === id);
  if (index === -1) {
    return undefined;
  }
  return ROLES[index];
}

export const ROLES: IRole[] = [
  {
    role: "requestor",
    name: "Requestor",
    id: 1
  },
  {
    role: "department_supervisor",
    name: "Department Supervisor",
    id: 2
  },
  {
    role: "coned_field_supervisor",
    name: "ConEd Field Supervisor",
    id: 3
  },
  {
    role: "coned_billing_admin",
    name: "ConEd Billing Admin (CBA)",
    id: 4
  },
  {
    role: "dispatcher",
    name: "Dispatcher",
    id: 5
  },
  {
    role: "dispatcher_supervisor",
    name: "Dispatcher Supervisor",
    id: 6
  },
  {
    role: "billing",
    name: "Billing",
    id: 7
  },
  {
    role: "superadmin",
    name: "SuperAdmin",
    id: 8
  },
  {
    role: "worker",
    name: "Worker",
    id: 9
  },
  {
    role: "ces_field_supervisor",
    name: "CES Field Supervisor",
    id: 10
  },
  {
    role: "subcontractor",
    name: "Subcontractor",
    id: 11
  },
  {
    role: "guest",
    name: "Guest",
    id: 12
  }
];

export enum EROLES {
  requestor = 1,
  department_supervisor,
  coned_field_supervisor,
  coned_billing_admin,
  dispatcher,
  dispatcher_supervisor,
  billing,
  superadmin,
  worker,
  ces_field_supervisor,
  subcontractor,
  guest,
}
