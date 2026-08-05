import sys

with open("src/app/actions.ts", "r") as f:
    content = f.read()

old_catch = """  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu địa hình:', error);
    return { success: false, error: 'Đã xảy ra lỗi khi lưu' };
  }"""
new_catch = """  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu địa hình:', error);
    require('fs').writeFileSync('terrain_error.log', String(error) + '\\n' + (error.stack || ''));
    return { success: false, error: String(error) };
  }"""

content = content.replace(old_catch, new_catch)

with open("src/app/actions.ts", "w") as f:
    f.write(content)
print("Patched actions.ts to log error")
