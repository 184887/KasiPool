-- Removes the test shops, everything they did and every test pool (is_test).
-- Same as "Remove test data" in Admin -> Settings. See docs/testing.md.
select private.clear_test_data();
