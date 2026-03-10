CREATE POLICY "Enable delete for anyone" ON "public"."gts" AS PERMISSIVE FOR DELETE TO public USING (true);
