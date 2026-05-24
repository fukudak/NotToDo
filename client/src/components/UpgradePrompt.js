import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function UpgradePrompt({ plan }) {
    const isPro = plan === "pro";
    const handleDummy = () => {
        window.alert("近日公開です");
    };
    if (isPro) {
        return (_jsx("div", { className: "settings-panel upgrade-prompt", children: _jsx("p", { children: "\u3042\u306A\u305F\u306F\u6709\u6599\u7248\u3067\u3059" }) }));
    }
    return (_jsxs("div", { className: "settings-panel upgrade-prompt", children: [_jsx("h3", { children: "\u30D7\u30E9\u30F3\u3092\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9" }), _jsxs("div", { className: "plan-comparison", children: [_jsxs("div", { className: "plan-tier plan-free", children: [_jsx("h4", { children: "\u7121\u6599\u7248" }), _jsxs("ul", { children: [_jsx("li", { children: "3\u4EF6\u307E\u3067" }), _jsx("li", { children: "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u53EF" })] })] }), _jsxs("div", { className: "plan-tier plan-pro", children: [_jsx("h4", { children: "\u6709\u6599\u7248" }), _jsxs("ul", { children: [_jsx("li", { children: "\u7121\u5236\u9650" }), _jsx("li", { children: "\u30AF\u30E9\u30A6\u30C9\u540C\u671F\uFF08\u5C06\u6765\uFF09" }), _jsx("li", { children: "\u512A\u5148\u30B5\u30DD\u30FC\u30C8" })] })] })] }), _jsxs("div", { className: "upgrade-actions", children: [_jsx("button", { type: "button", className: "btn-upgrade", onClick: handleDummy, children: "\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9" }), _jsx("button", { type: "button", className: "btn-restore", onClick: handleDummy, children: "\u5FA9\u5143\u8CFC\u5165" })] })] }));
}
