use tauri::{
    App, Manager,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
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
            // Show the window on:
            //   - Left-click release (single click — macOS / Linux convention)
            //   - Left double-click (Windows convention)
            // We match the Up state of Click rather than the press, so a
            // single click doesn't fire show() twice (once on Down, once on
            // Up). DoubleClick covers Windows users who expect that pattern;
            // single-click on Windows still works for those who try it.
            let should_show = matches!(
                event,
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } | TrayIconEvent::DoubleClick {
                    button: MouseButton::Left,
                    ..
                }
            );
            if should_show {
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
