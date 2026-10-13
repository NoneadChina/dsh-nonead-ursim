# op 分类矩阵（生成物，请勿手改）

> 由 `node scripts/tool-matrix.mjs --write` 生成，由 `node scripts/tool-matrix.mjs` 校验。
> 声明表是 [`docs/tool-matrix.json`](./tool-matrix.json)：新增一个 op 必须在那里显式声明它
> **是否受人工审批门禁**、**仿真会怎么处理它** —— 这两件事以前是"沉默的默认值"，
> H-1（七个带物理副作用的 op 免审批）就是这样溜过去的。

共 **86** 个 op：受门禁 **47**、仿真实现 **45**、仿真透传 **6**、仿真明确不支持 **35**。

| op | 工具 | 审批门禁 | 仿真 | 声明理由 |
| --- | --- | --- | --- | --- |
| `brake_release` | `ursim_brake_release` | **是** | unsupported |  |
| `connect` | `ursim_connect` | 否 | passthrough |  |
| `conveyor_tracking` | `ursim_set_conveyor_tracking` | **是** | unsupported |  |
| `disconnect` | `ursim_disconnect` | 否 | passthrough |  |
| `draw_circle` | `ursim_draw_circle` | **是** | simulated |  |
| `draw_rectangle` | `ursim_draw_rectangle` | **是** | simulated |  |
| `draw_square` | `ursim_draw_square` | **是** | simulated |  |
| `draw_star` | `ursim_draw_star` | **是** | simulated |  |
| `end_force_mode` | `ursim_end_force_mode` | **是** | unsupported |  |
| `force_mode` | `ursim_force_mode` | **是** | unsupported |  |
| `force_mode_settings` | `ursim_force_mode_settings` | **是** | unsupported |  |
| `get_analog_in` | `ursim_get_analog_in` | 否 | simulated |  |
| `get_bit_register` | `ursim_get_bit_register` | 否 | simulated |  |
| `get_conveyor` | `ursim_get_conveyor` | 否 | unsupported |  |
| `get_digital_in` | `ursim_get_digital_in` | 否 | simulated |  |
| `get_digital_input_bits` | `ursim_get_digital_in_bits` | 否 | simulated |  |
| `get_digital_output_bits` | `ursim_get_digital_out_bits` | 否 | simulated |  |
| `get_double_register` | `ursim_get_double_register` | 否 | simulated |  |
| `get_freedrive_status` | `ursim_get_freedrive_status` | 否 | unsupported |  |
| `get_int_register` | `ursim_get_int_register` | 否 | simulated |  |
| `get_joint_pose` | `ursim_get_joint_pose` | 否 | simulated |  |
| `get_joint_temperatures` | `ursim_get_joint_temperatures` | 否 | simulated |  |
| `get_program_state` | `ursim_get_program_state` | 否 | simulated |  |
| `get_robot_current` | `ursim_get_robot_current` | 否 | simulated |  |
| `get_robot_mode` | `ursim_get_robot_mode` | 否 | simulated |  |
| `get_robot_model` | `ursim_get_robot_model` | 否 | simulated |  |
| `get_robot_voltage` | `ursim_get_robot_voltage` | 否 | simulated |  |
| `get_runtime_telemetry` | `ursim_get_runtime_telemetry` | 否 | simulated |  |
| `get_safety_mode` | `ursim_get_safety_mode` | 否 | simulated |  |
| `get_safety_status` | `ursim_get_safety_status` | 否 | unsupported |  |
| `get_serial_number` | `ursim_get_serial_number` | 否 | simulated |  |
| `get_software_version` | `ursim_get_software_version` | 否 | simulated |  |
| `get_speed_scaling` | `ursim_get_speed_scaling` | 否 | simulated |  |
| `get_target_values` | `ursim_get_target_values` | 否 | simulated |  |
| `get_tcp_force` | `ursim_get_tcp_force` | 否 | simulated |  |
| `get_tcp_pose` | `ursim_get_tcp_pose` | 否 | simulated |  |
| `get_time` | `ursim_get_uptime` | 否 | simulated |  |
| `get_tool_analog_in` | `ursim_get_tool_analog_in` | 否 | unsupported |  |
| `get_tool_telemetry` | `ursim_get_tool_telemetry` | 否 | unsupported |  |
| `list_programs` | `ursim_list_programs` | 否 | unsupported |  |
| `load_program` | `ursim_load_program` | **是** | unsupported |  |
| `motion_version` | `ursim_motion_version` | **是** | unsupported |  |
| `move_optimized` | `ursim_move_optimized` | **是** | simulated |  |
| `move_tool_x` | `ursim_move_tool_x` | **是** | simulated |  |
| `move_tool_y` | `ursim_move_tool_y` | **是** | simulated |  |
| `move_tool_z` | `ursim_move_tool_z` | **是** | simulated |  |
| `move_x` | `ursim_move_x` | **是** | simulated |  |
| `move_y` | `ursim_move_y` | **是** | simulated |  |
| `move_z` | `ursim_move_z` | **是** | simulated |  |
| `movec` | `ursim_movec` | **是** | simulated |  |
| `movej` | `ursim_movej` | **是** | simulated |  |
| `movel` | `ursim_movel` | **是** | simulated |  |
| `movep` | `ursim_movep` | **是** | simulated |  |
| `pause_program` | `ursim_pause_program` | 否 | unsupported |  |
| `ping` | `ursim_ping` | 否 | passthrough |  |
| `power_off` | `ursim_power_off` | **是** | unsupported |  |
| `power_on` | `ursim_power_on` | **是** | unsupported |  |
| `reset_error` | `ursim_reset_error` | **是** | unsupported |  |
| `run_program` | `ursim_run_program` | **是** | unsupported |  |
| `send_script` | `ursim_send_script` | **是** | unsupported |  |
| `servoj` | `ursim_servoj` | **是** | simulated |  |
| `set_analog_out` | `ursim_set_analog_out` | **是** | simulated |  |
| `set_conveyor_tick` | `ursim_set_conveyor_tick` | **是** | unsupported |  |
| `set_digital_out` | `ursim_set_digital_out` | **是** | simulated |  |
| `set_freedrive` | `ursim_set_freedrive` | **是** | unsupported |  |
| `set_gravity` | `ursim_set_gravity` | **是** | unsupported |  |
| `set_payload` | `ursim_set_payload` | **是** | unsupported |  |
| `set_payload_inertia` | `ursim_set_payload_inertia` | **是** | unsupported |  |
| `set_tcp` | `ursim_set_tcp` | **是** | unsupported |  |
| `set_teach_mode` | `ursim_set_teach_mode` | **是** | unsupported |  |
| `set_tool_output_mode` | `ursim_set_tool_output_mode` | **是** | unsupported |  |
| `set_tool_voltage` | `ursim_set_tool_voltage` | **是** | unsupported |  |
| `shutdown` | `ursim_shutdown` | **是** | unsupported |  |
| `sim_start` | `ursim_sim_start` | 否 | passthrough |  |
| `sim_status` | `ursim_sim_status` | 否 | passthrough |  |
| `sim_stop` | `ursim_sim_stop` | 否 | passthrough |  |
| `speedj` | `ursim_speedj` | **是** | unsupported |  |
| `speedl` | `ursim_speedl` | **是** | unsupported |  |
| `status` | `ursim_get_status` | 否 | simulated |  |
| `stop_program` | `ursim_stop_program` | 否 | unsupported |  |
| `stopj` | `ursim_stopj` | **是** | simulated |  |
| `stopl` | `ursim_stopl` | **是** | simulated |  |
| `tool_communication` | `ursim_set_tool_communication` | **是** | unsupported |  |
| `unlock_protective_stop` | `ursim_unlock_protective_stop` | **是** | unsupported |  |
| `wait_steady` | `ursim_wait_steady` | 否 | simulated |  |
| `zero_ftsensor` | `ursim_zero_ftsensor` | **是** | unsupported |  |
