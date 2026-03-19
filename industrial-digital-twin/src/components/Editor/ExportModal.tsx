import { useState } from 'react'
import { useSceneStore } from '../../stores'

interface ExportModalProps {
  onClose: () => void
}

export function ExportModal({ onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState<'html' | 'web'>('html')
  const [includeData, setIncludeData] = useState(true)
  const [compress, setCompress] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const { getSceneData } = useSceneStore()

  const handleExport = async () => {
    setIsExporting(true)

    const sceneData = getSceneData()
    
    // 创建导出内容
    const exportContent = generateExportHTML(sceneData, {
      type: exportType,
      includeDataBindings: includeData,
      compress
    })

    // 下载文件
    const blob = new Blob([exportContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sceneData.name || 'scene'}_digital_twin.html`
    a.click()
    URL.revokeObjectURL(url)

    setIsExporting(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">📤 导出项目</div>
        
        <div className="modal-content">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              导出格式
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className={`toolbar-btn ${exportType === 'html' ? 'active' : ''}`}
                onClick={() => setExportType('html')}
                style={{ flex: 1 }}
              >
                🌐 单HTML文件
              </button>
              <button 
                className={`toolbar-btn ${exportType === 'web' ? 'active' : ''}`}
                onClick={() => setExportType('web')}
                style={{ flex: 1 }}
              >
                📦 Web应用包
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              选项
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeData}
                  onChange={e => setIncludeData(e.target.checked)}
                />
                <span style={{ fontSize: 13 }}>包含数据绑定配置</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={compress}
                  onChange={e => setCompress(e.target.checked)}
                />
                <span style={{ fontSize: 13 }}>压缩代码 (减小文件体积)</span>
              </label>
            </div>
          </div>

          <div style={{ 
            padding: 12, 
            background: 'var(--bg-tertiary)', 
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              导出说明
            </div>
            {exportType === 'html' ? (
              <div>
                导出一个独立的 HTML 文件，可以直接在浏览器中打开运行。
                适合简单场景和快速演示。
              </div>
            ) : (
              <div>
                导出一个完整的 Web 应用包，包含：
                <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                  <li>index.html 入口文件</li>
                  <li>three.min.js (Three.js 库)</li>
                  <li>scene.json (场景数据)</li>
                  <li>app.js (运行时)</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 生成导出的HTML内容
function generateExportHTML(sceneData: any, config: { type: string; includeDataBindings: boolean; compress: boolean }): string {
  const sceneJson = JSON.stringify(sceneData)
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sceneData.name || '数字孪生'} - 工业仿真</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a14; }
    #container { width: 100%; height: 100%; }
    #loading { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #0a0a14; display: flex; align-items: center; justify-content: center; color: #fff; z-index: 1000; }
  </style>
</head>
<body>
  <div id="loading">加载中...</div>
  <div id="container"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // 场景数据
    const sceneData = ${sceneJson};
    
    // 初始化Three.js
    const container = document.getElementById('container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneData.settings?.backgroundColor || '#0a0a14');
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // 控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 光照
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(10, 20, 10);
    scene.add(directional);
    
    // 辅助网格
    if (sceneData.settings?.gridHelper !== false) {
      const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      scene.add(grid);
    }
    
    // 创建场景对象
    const objectMap = {};
    
    function createMaterial(mat) {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.color || '#888888'),
        metalness: mat.metalness || 0,
        roughness: mat.roughness || 0.5,
        transparent: mat.transparent || false,
        opacity: mat.opacity ?? 1
      });
    }
    
    function createGeometry(type, params) {
      switch(type) {
        case 'box': return new THREE.BoxGeometry(params.width||1, params.height||1, params.depth||1);
        case 'sphere': return new THREE.SphereGeometry(params.radius||0.5, 32, 32);
        case 'cylinder': return new THREE.CylinderGeometry(params.radius||0.5, params.radius||0.5, params.height||1, 32);
        case 'cone': return new THREE.ConeGeometry(params.radius||0.5, params.height||1, 32);
        case 'torus': return new THREE.TorusGeometry(params.radius||0.5, params.tube||0.2, 16, 32);
        case 'plane': return new THREE.PlaneGeometry(params.width||1, params.height||1);
        default: return new THREE.BoxGeometry(1,1,1);
      }
    }
    
    // 构建场景
    Object.values(sceneData.objects).forEach(obj => {
      let mesh;
      if (obj.type === 'mesh') {
        const geo = createGeometry(obj.geometryType || 'box', obj.geometry || {});
        const mat = createMaterial(obj.material || {});
        mesh = new THREE.Mesh(geo, mat);
      } else if (obj.type === 'light') {
        const light = new THREE.PointLight(obj.color, obj.intensity, obj.distance);
        mesh = light;
      } else if (obj.type === 'group') {
        mesh = new THREE.Group();
      }
      
      if (mesh) {
        mesh.name = obj.name;
        mesh.position.copy(obj.position);
        mesh.rotation.copy(obj.rotation);
        mesh.scale.copy(obj.scale);
        mesh.visible = obj.visible;
        scene.add(mesh);
        objectMap[obj.id] = mesh;
      }
    });
    
    // 隐藏加载提示
    document.getElementById('loading').style.display = 'none';
    
    // 动画循环
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    
    // 窗口调整
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`
}
