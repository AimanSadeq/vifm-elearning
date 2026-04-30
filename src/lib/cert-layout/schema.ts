import { z } from "zod";

const baseElementSchema = z.object({
  id: z.string().min(1).max(80),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string().max(80).optional(),
  locked: z.boolean().optional(),
});

const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  text: z.string().max(500),
  fontSize: z.number().min(4).max(400),
  fontFamily: z.enum(["serif", "sans", "mono"]),
  fontWeight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
  ]),
  fontStyle: z.enum(["normal", "italic"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  align: z.enum(["left", "center", "right"]),
  letterSpacing: z.number().min(0).max(40).optional(),
  width: z.number().min(0).max(100).optional(),
});

const rectElementSchema = baseElementSchema.extend({
  type: z.literal("rect"),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  borderWidth: z.number().min(0).max(40),
  fillColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  radius: z.number().min(0).max(50).optional(),
});

const circleElementSchema = baseElementSchema.extend({
  type: z.literal("circle"),
  diameter: z.number().min(0).max(100),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  borderWidth: z.number().min(0).max(40),
  fillColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const lineElementSchema = baseElementSchema.extend({
  type: z.literal("line"),
  length: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  thickness: z.number().min(0).max(40),
});

export const certElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  rectElementSchema,
  circleElementSchema,
  lineElementSchema,
]);

export const certLayoutSchema = z.object({
  pageWidth: z.number().min(50).max(1000),
  pageHeight: z.number().min(50).max(1000),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  // Cap element count so a malicious / runaway client can't DoS the storage
  // path with absurd JSON.
  elements: z.array(certElementSchema).max(200),
});
