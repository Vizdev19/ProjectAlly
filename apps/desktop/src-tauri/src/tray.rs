use tauri::{
    App, Manager,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};

pub fn setup_tray(app: &mut App) -> tauri::Result<()> {
    let quit = MenuItem::with_id(app, "quit", "Quit AllyTracker", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Open AllyTracker", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    // Embed the tray icon at compile time. TrayIconBuilder in Tauri 2
    // *requires* an explicit icon — without one, .build() returns
    // Err("tray icon must have an icon") and the entire app aborts at launch
    // (the `trayIcon.iconPath` config field is a v1 leftover that v2 ignores).
    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
