export interface IDepartment {
  id: number;
  name: string;
  otBreak: boolean;
  group: number;
}

export enum DEPARTMENT_GROUPS {
  CONSTRUCTION_SERVICE_GROUP,
  ELECTRIC_GROUP,
  GAS_PRESSURE_CONTROL_GROUP,
  TRANSMISSION_SERVICE
}

export const DEPARTMENTS: IDepartment[] = [
  {
    id: 1,
    name: "Electric - Services",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 2,
    name: "Electric - Equipment Groups Networks",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 3,
    name: "Electric - Emergency",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 4,
    name: "Electric - Bronx Underground/Cable",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 5,
    name: "Electric - Bronx Overhead",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 6,
    name: "Electric - Rye Overhead",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 7,
    name: "Electric - Westchester Underground",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 8,
    name: "Electric - Substation Maintenance",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 9,
    name: "Electric - Environmental Operations/ Flush",
    otBreak: false,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 10,
    name: "Gas - Bronx",
    otBreak: true,
    group: DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP
  },
  {
    id: 11,
    name: "Gas - Brooklyn",
    otBreak: false,
    group: DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP
  },
  {
    id: 12,
    name: "Gas - Manhattan",
    otBreak: false,
    group: DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP
  },
  {
    id: 13,
    name: "Gas - Westchester",
    otBreak: true,
    group: DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP
  },
  {
    id: 14,
    name: "Gas - Staten Island",
    otBreak: false,
    group: DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP
  },
  {
    id: 15,
    name: "Electric - SI Procurement",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 16,
    name: "Electric - SI Overhead",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 17,
    name: "Electric - SI Underground",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 18,
    name: "Electric - SI I&A",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 19,
    name: "Electric - SI Clerical",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 20,
    name: "Electric - SI Control Center",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 21,
    name: "Pressure Control",
    otBreak: false,
    group: DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP
  },
  {
    id: 22,
    name: "Construction Services",
    otBreak: false,
    group: DEPARTMENT_GROUPS.CONSTRUCTION_SERVICE_GROUP
  },
  {
    id: 23,
    name: "Transmission Services",
    otBreak: true,
    group: DEPARTMENT_GROUPS.TRANSMISSION_SERVICE
  },
  {
    id: 24,
    name: "Electric - Field Operations",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 25,
    name: "Electric - East View Overhead",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
  {
    id: 26,
    name: "Electric - ICS",
    otBreak: true,
    group: DEPARTMENT_GROUPS.ELECTRIC_GROUP
  },
];

export const searchDepartmentsByName = (name: string): number[] => {
  const res = new Array<number>();
  DEPARTMENTS.forEach((department: IDepartment) => {
    const re = new RegExp(name, "si");
    if (department.name.match(re)) {
      res.push(department.id);
    }
  });
  return res;
};

export const searchDepartmentById = (id: number) => {
  return DEPARTMENTS[DEPARTMENTS.findIndex((department: IDepartment) => department.id === id)];
};
