// The API contract, shared by the NestJS controller and the React app (type-only import),
// so a change here is checked end to end by the compiler.
export type OrgUnitDto = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
};

export type CreateOrgUnitDto = {
  name: string;
  parentId?: string | null;
};
