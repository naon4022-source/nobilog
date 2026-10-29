"""Check source identity and confirmation invalidation without opening image content."""
import unittest

from reference_catalog import reconcile, stable_id


class ReferenceCatalogTests(unittest.TestCase):
    def test_path_identity_is_stable(self):
        self.assertEqual(stable_id("国語資料集/a.jpg"), stable_id("国語資料集/a.jpg"))
        self.assertNotEqual(stable_id("国語資料集/a.jpg"), stable_id("国語の教科書/a.jpg"))

    def test_new_and_changed_images_are_unverified(self):
        source = "国語の教科書/a.jpg"
        old = reconcile(source, "old", "textbook-reference", "中一", None)
        self.assertFalse(old["verified"])
        old.update(verified=True, pages=[12], units=["例"])
        changed = reconcile(source, "new", "textbook-reference", "中一", old)
        self.assertFalse(changed["verified"])
        self.assertEqual(changed["pages"], [])
        self.assertEqual(changed["units"], [])
        same = reconcile(source, "old", "textbook-reference", "中一", old)
        self.assertTrue(same["verified"])
        self.assertEqual(same["pages"], [12])


if __name__ == "__main__":
    unittest.main()
