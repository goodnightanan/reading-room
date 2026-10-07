import readingRoomScreen from "./ui/reading_room.ui.js";

// 想改包名就改这里 + manifest.json 里的 toolpkg_id，两处保持一致
const TOOLPKG_ID = "com.readingroom.operit";
const ROUTE_ID = "toolpkg:" + TOOLPKG_ID + ":ui:reading_room";

export function registerToolPkg(): boolean {
  ToolPkg.registerUiRoute({
    id: "reading_room",
    route: ROUTE_ID,
    runtime: "compose_dsl",
    screen: readingRoomScreen,
    params: {},
    title: { zh: "阅读室", en: "Reading Room" },
    keepAlive: true,
  });

  // 能装上的社区包都加了这个判断，照抄：老版本没有这个 API 时不至于整包挂掉
  if (ToolPkg.registerNavigationEntry) {
    ToolPkg.registerNavigationEntry({
      id: "reading_room_sidebar",
      route: ROUTE_ID,
      surface: "main_sidebar_plugins",
      title: { zh: "阅读室", en: "Reading Room" },
      icon: "menu_book",
      order: 30,
    });
  }

  return true;
}
