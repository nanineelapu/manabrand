/** GROQ snippet that turns the shared link fields (kind / page / url) into one `href` string. Kept free of the `sanity` package so server code can import it. */
export const HREF = `coalesce(select(kind == "custom" => url, "/" + page->slug.current), "/")`;
