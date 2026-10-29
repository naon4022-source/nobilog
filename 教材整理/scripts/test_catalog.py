import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import catalog


class CatalogBuilderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.old_paths = (catalog.PROJECT, catalog.MATERIALS, catalog.SOURCE_LIST, catalog.CATALOG, catalog.OCR_DIR)
        self.project = Path(self.temp.name)
        catalog.PROJECT = self.project
        catalog.MATERIALS = self.project / "教材整理"
        catalog.SOURCE_LIST = catalog.MATERIALS / "教材ファイル一覧.json"
        catalog.CATALOG = catalog.MATERIALS / "教材照合台帳.json"
        catalog.OCR_DIR = catalog.MATERIALS / "OCR"
        catalog.OCR_DIR.mkdir(parents=True)
        (self.project / "数学ワーク").mkdir()
        self.source = self.project / "数学ワーク" / "unit.jpg"
        self.source.write_bytes(b"workbook source bytes")
        catalog.SOURCE_LIST.write_text(json.dumps([str(self.source)]), encoding="utf-8")
        self.digest = hashlib.sha256(self.source.read_bytes()).hexdigest()
        (catalog.OCR_DIR / "0000.json").write_text(json.dumps({
            "file": str(self.source),
            "lines": [{"text": "式の計算", "x": 0.1, "y": 0.9}],
        }), encoding="utf-8")
        catalog.CATALOG.write_text(json.dumps([{
            "id": "source-0042",
            "file": "数学ワーク/unit.jpg",
            "sha256": self.digest,
            "mode": "workbook",
            "subject": "数学",
            "ocrComplete": False,
            "verified": True,
            "titleCandidates": [],
            "grade": 2,
            "pages": ["p5"],
            "reviewNote": "人が原本と照合済み",
        }]), encoding="utf-8")

    def tearDown(self):
        (catalog.PROJECT, catalog.MATERIALS, catalog.SOURCE_LIST, catalog.CATALOG, catalog.OCR_DIR) = self.old_paths

    def test_preserves_review_and_stable_id_for_unchanged_source(self):
        row = catalog.build()[0]
        self.assertEqual(row["id"], "source-0042")
        self.assertTrue(row["verified"])
        self.assertEqual((row["grade"], row["pages"]), (2, ["p5"]))
        self.assertEqual(row["reviewNote"], "人が原本と照合済み")
        self.assertTrue(row["ocrComplete"])
        self.assertEqual(row["titleCandidates"], ["式の計算"])

    def test_source_change_invalidates_old_confirmation(self):
        self.source.write_bytes(b"changed source bytes")
        row = catalog.build()[0]
        self.assertFalse(row["verified"])
        self.assertIsNone(row["grade"])
        self.assertEqual(row["pages"], [])
        self.assertIn("再確認", row["reviewNote"])

    def test_new_file_gets_new_id_and_unknown_folder_fails_closed(self):
        (self.project / "社会ワーク").mkdir()
        extra = self.project / "社会ワーク" / "unit.pdf"
        extra.write_bytes(b"social workbook")
        catalog.SOURCE_LIST.write_text(json.dumps([str(self.source), str(extra)]), encoding="utf-8")
        rows = catalog.build()
        self.assertEqual([row["id"] for row in rows], ["source-0042", "source-0043"])
        unknown = self.project / "素材かも" / "unit.jpg"
        unknown.parent.mkdir()
        unknown.write_bytes(b"unknown")
        catalog.SOURCE_LIST.write_text(json.dumps([str(unknown)]), encoding="utf-8")
        with self.assertRaises(ValueError):
            catalog.build()

    def test_known_future_subject_folders_are_mapped(self):
        for folder, subject in catalog.WORKBOOK_ROOTS.items():
            self.assertEqual(catalog.classify(f"{folder}/unit.pdf"), ("workbook", subject))


if __name__ == "__main__":
    unittest.main()
