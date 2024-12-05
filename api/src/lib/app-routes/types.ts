import type { AppRoute } from "../../db/schema.js";

export type AppRoutesTreeResponse = {
  tree: Array<TreeNode>;
  unmatched: Array<AppRoute>;
};

export type AppRouteWithFileName = AppRoute & {
  fileName?: string;
};

export type TreeNode = {
  path: string;
  routes: Array<AppRouteWithFileName>;
  children: Array<TreeNode>;
};
