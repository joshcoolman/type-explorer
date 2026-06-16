import Card from "./Card";

/**
 * A larger surface (settings sheets, the voice editor, callout sections).
 * Semantic alias over Card with surface radius and generous padding defaults.
 * Color is the caller's, same as Card.
 */
export default function Panel({
  pad = "lg",
  radius = "surface",
  ...rest
}: React.ComponentProps<typeof Card>) {
  return <Card pad={pad} radius={radius} {...rest} />;
}
