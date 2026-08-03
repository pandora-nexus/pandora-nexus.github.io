export const ENGINE_TEMPLATES: Record<string, { files: { path: string; content: string }[]; description: string }> = {
  unity: {
    description: "Unity 2D/3D oyun motoru başlangıç şablonu",
    files: [
      { path: "Assets/Scripts/GameManager.cs", content: "using UnityEngine;\n\npublic class GameManager : MonoBehaviour {\n    void Start() { }\n    void Update() { }\n}" },
      { path: "Assets/Scripts/PlayerController.cs", content: "using UnityEngine;\n\npublic class PlayerController : MonoBehaviour {\n    public float speed = 5f;\n    void Update() {\n        float h = Input.GetAxis(\"Horizontal\");\n        float v = Input.GetAxis(\"Vertical\");\n        transform.Translate(new Vector3(h, v, 0) * speed * Time.deltaTime);\n    }\n}" },
      { path: "ProjectSettings/ProjectVersion.txt", content: "m_EditorVersion: 2023.3.0f1" },
    ],
  },
  godot: {
    description: "Godot 4.x oyun motoru başlangıç şablonu",
    files: [
      { path: "scripts/game_manager.gd", content: "extends Node\n\nfunc _ready():\n    pass\n\nfunc _process(delta):\n    pass" },
      { path: "scripts/player.gd", content: "extends CharacterBody2D\n\nvar speed = 300.0\n\nfunc _physics_process(delta):\n    var velocity = Vector2.ZERO\n    if Input.is_action_pressed(\"ui_right\"):\n        velocity.x += 1\n    if Input.is_action_pressed(\"ui_left\"):\n        velocity.x -= 1\n    if Input.is_action_pressed(\"ui_down\"):\n        velocity.y += 1\n    if Input.is_action_pressed(\"ui_up\"):\n        velocity.y -= 1\n    velocity = velocity.normalized() * speed\n    move_and_slide()" },
      { path: "project.godot", content: "[application]\nconfig/name=\"Yeni Oyun\"\nconfig/features=PackedStringArray(\"4.3\")" },
    ],
  },
  phaser: {
    description: "Phaser.js HTML5 oyun motoru başlangıç şablonu",
    files: [
      { path: "index.html", content: "<!DOCTYPE html>\n<html>\n<head><title>Yeni Oyun</title></head>\n<body>\n<script src=\"game.js\"></script>\n</body>\n</html>" },
      { path: "game.js", content: "const config = {\n    type: Phaser.AUTO,\n    width: 800,\n    height: 600,\n    scene: { preload() {}, create() {}, update() {} }\n};\nnew Phaser.Game(config);" },
    ],
  },
};

export function getEngineTemplate(engine: string) {
  const key = engine.toLowerCase().replace(/[^a-z]/g, '');
  if (key.includes("unity")) return ENGINE_TEMPLATES.unity;
  if (key.includes("godot")) return ENGINE_TEMPLATES.godot;
  if (key.includes("phaser")) return ENGINE_TEMPLATES.phaser;
  return null;
}