import { render } from "@react-email/render";

export async function renderEmailTemplate(component: React.ReactElement) {
  const [html, text] = await Promise.all([
    render(component, { pretty: true }),
    render(component, { plainText: true }),
  ]);

  return { html, text };
}
