// stories/PermissionTree.stories.tsx
import React from "react";
import { Meta } from "@storybook/react";
import { PermissionTree } from "./components/PermissionTree";

export default {
  title: "Example/PermissionTree",
  component: PermissionTree,
  parameters: {
    docs: {},
  },
} as Meta;

const Template = () => <PermissionTree />;

export const Default = Template.bind({});
