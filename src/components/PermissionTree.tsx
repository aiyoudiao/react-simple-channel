import React, { useMemo, useState, useEffect } from "react";
import { Tree, Button, Space, Typography, Radio } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import { useBroadcastSync } from "../toolkit";

const { Text } = Typography;

type PermissionKey = string;

const treeData: DataNode[] = [
  {
    title: "管理后台",
    key: "admin",
    children: [
      { title: "用户管理", key: "user_manage" },
      { title: "角色管理", key: "role_manage" },
      { title: "权限设置", key: "permission_manage" },
    ],
  },
  {
    title: "订单系统",
    key: "order_system",
    children: [
      { title: "订单查看", key: "order_view" },
      { title: "订单编辑", key: "order_edit" },
    ],
  },
];

// 多语言文案
const i18n = {
  zh: {
    title: "权限树形设置 & 按钮权限控制示例",
    selectPermission: "请选择权限：",
    pageButtons: "页面按钮（根据权限显示）:",
    buttons: {
      user_manage: "用户管理按钮",
      role_manage: "角色管理按钮",
      permission_manage: "权限设置按钮",
      order_view: "订单查看按钮",
      order_edit: "订单编辑按钮",
    },
    syncNote: "权限状态已通过 BroadcastChannel 跨标签页同步。",
    language: "语言",
  },
  en: {
    title: "Permission Tree & Button Permission Control Example",
    selectPermission: "Please select permissions:",
    pageButtons: "Page Buttons (Visible Based on Permissions):",
    buttons: {
      user_manage: "User Management Button",
      role_manage: "Role Management Button",
      permission_manage: "Permission Setting Button",
      order_view: "Order View Button",
      order_edit: "Order Edit Button",
    },
    syncNote:
      "Permission status is synchronized across tabs via BroadcastChannel.",
    language: "Language",
  },
};

const buttonsPermissions: {
  key: PermissionKey;
  labelKey: keyof (typeof i18n)["zh"]["buttons"];
  type: string;
}[] = [
  { key: "user_manage", labelKey: "user_manage", type: "admin" },
  { key: "role_manage", labelKey: "role_manage", type: "admin" },
  { key: "permission_manage", labelKey: "permission_manage", type: "admin" },
  { key: "order_view", labelKey: "order_view", type: "order_system" },
  { key: "order_edit", labelKey: "order_edit", type: "order_system" },
];

const CHANNEL_NAME = "app-permission-sync";
const LANG_KEY = "app-lang";

export const PermissionTree: React.FC = () => {
  const [checkedKeys, setCheckedKeys] = useBroadcastSync<PermissionKey[]>(
    CHANNEL_NAME,
    [],
    {
      debounceMs: 200,
    }
  );

  // 语言状态，优先从 localStorage 读，默认 zh
  const [lang, setLang] = useState<"zh" | "en">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "zh" || saved === "en") return saved;
    }
    return "en";
  });

  // 语言切换回调，写 localStorage
  const onLangChange = (e: any) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  };

  const onCheck: TreeProps["onCheck"] = (checkedKeysValue) => {
    let keys: string[];
    if (Array.isArray(checkedKeysValue)) {
      keys = checkedKeysValue as string[];
    } else {
      keys = checkedKeysValue.checked as string[];
    }
    setCheckedKeys(keys);
  };

  const hasPermission = (key: PermissionKey) => checkedKeys.includes(key);

  const t = i18n[lang]; // 当前语言文案

  // 语言版本的树节点，title 替换
  const localizedTreeData = useMemo(() => {
    // 递归替换 title
    const mapNode = (node: DataNode): DataNode => {
      // 找到对应 key 在 i18n.zh 中的 title（这里用静态映射，也可直接用原 treeData）
      let title = node.title;
      // 因为原 treeData title 是中文，只在中文语言展示
      if (lang === "en") {
        // 用英文替换
        switch (node.key) {
          case "admin":
            title = "Admin Console";
            break;
          case "user_manage":
            title = "User Management";
            break;
          case "role_manage":
            title = "Role Management";
            break;
          case "permission_manage":
            title = "Permission Settings";
            break;
          case "order_system":
            title = "Order System";
            break;
          case "order_view":
            title = "Order View";
            break;
          case "order_edit":
            title = "Order Edit";
            break;
          default:
            break;
        }
      }
      return {
        ...node,
        title,
        children: node.children ? node.children.map(mapNode) : undefined,
      };
    };
    return treeData.map(mapNode);
  }, [lang]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        <div>
          <Text className="mr-2">{t.language}:</Text>
          <Radio.Group size="small" onChange={onLangChange} value={lang}>
            <Radio.Button value="en">English</Radio.Button>
            <Radio.Button value="zh">中文</Radio.Button>
          </Radio.Group>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Text strong>{t.selectPermission}</Text>
          <Tree
            checkable
            selectable={false}
            onCheck={onCheck}
            checkedKeys={checkedKeys}
            treeData={localizedTreeData}
            defaultExpandAll
            className="border rounded p-2 mt-2"
          />
        </div>

        {/* 按钮显示区 */}
        <div className="flex-1">
          <Text strong>{t.pageButtons}</Text>
          <div className="mt-4">
            {buttonsPermissions
              .filter((button) => button.type === "admin")
              .map(({ key, labelKey }) => (
                <Button
                  key={key}
                  color="primary"
                  variant="solid"
                  disabled={!hasPermission(key)}
                  className="min-w-[140px] block my-2"
                >
                  {t.buttons[labelKey]}
                </Button>
              ))}
          </div>
          <div className="mt-4">
            {buttonsPermissions
              .filter((button) => button.type === "order_system")
              .map(({ key, labelKey }) => (
                <Button
                  key={key}
                  color="pink"
                  variant="solid"
                  disabled={!hasPermission(key)}
                  className="min-w-[140px] block my-2"
                >
                  {t.buttons[labelKey]}
                </Button>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">{t.syncNote}</div>
    </div>
  );
};
